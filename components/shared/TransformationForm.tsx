"use client"
 
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { aspectRatioOptions, defaultValues, transformationTypes } from "@/constants"
import { CustomField } from "./CustomField"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useState, useTransition } from "react"
import { AspectRatioKey, debounce, deepMergeObjects } from "@/lib/utils"
import { set } from "mongoose"
import MediaUploader from "./MediaUploader"
 
export const formSchema = z.object({
  title : z.string(),
  aspectRatio: z.string().optional(),
  color : z.string().optional(),
    prompt : z.string().optional(),
    publicId: z.string()

})


const TransformationForm = ({action, data = null, userId, type, creditBalance, config=null}: TransformationFormProps) => {
    const transformationType = transformationTypes[type]
    const [image, setImage] = useState(data)
    const [isSubmitting, setisSubmitting] = useState(false)
    const [isTransforming, setisTransforming] = useState(false)
    const [transformationConfig, setTransformationConfig] = useState(config)
    const[isPending, startTransition] = useTransition();
    const [newTransformation, setnewTransformation] = useState<Transformations | null>(null);


    const initialValues = data && action == 'Update' ?{
        title: data?.title,
        aspectRatio: data?.aspectRatio,
        color: data?.color,
        prompt: data?.prompt,
        publicId: data?.publicId,

    } : defaultValues
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialValues
      })
     
      // 2. Define a submit handler.
      function onSubmit(values: z.infer<typeof formSchema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        console.log(values)
      }
 
    const onTransformHandler =() => {
        setisTransforming(true)
        setTransformationConfig(
            deepMergeObjects( newTransformation,transformationConfig)
       
        )
        setnewTransformation(null)
        startTransition(async () => {
            // await updateCredits()
        })
    }

   //   when aspect ratio is selected
      const onSelectFieldHandler =(value : string,
        onChangeField: (value: string) => void) => {
            const imageSize = aspectRatioOptions[value as AspectRatioKey];
            setImage((prevState: any)=> ({
                ...prevState,
                aspectRatio: value,
                width: imageSize.width,
                height: imageSize.height,
            
            }))
            setnewTransformation(transformationType.config)
            return onChangeField(value)

        }

        // when input is changed
        const onInputChangeHandler = (fieldname: string, value: string, type: string, onChangeField: (value: string) => void) => {
            debounce(()=> {
                setnewTransformation((prevState: any) => ({
                    ...prevState,
                    [type]: {
                        ...prevState[type],
                        [fieldname=== 'prompt' ? 'prompt' : 'to'] : value,
                    },
                }))
                return onChangeField(value)
            }, 1000)

        }

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CustomField
                control = {form.control}
                render = {({field}) => <Input {...field} className="input-field"/>}
                name="title"
                formLabel="Image Title"
                className="w-full"
            />
            {/* selecting aspect Ration */}

          </form>
          {/* this only renders when the type is fill */}
          {
            type === 'fill' && (
                <CustomField 
                control={form.control}
                name = "aspectRatio"
                formLabel="Aspect Ratio"
                className="w-full"
                    render={({field}) => (
                        <Select
                        onValueChange={(value: any) => onSelectFieldHandler(value, field.onChange)}
                        value={field.value}
                        >
                        <SelectTrigger className="sleect-field">
                            <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(aspectRatioOptions).map((key) => (
                                <SelectItem key={key} value={key} className='select-item' >
                                    {aspectRatioOptions[key as AspectRatioKey].label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    )}
                    />
                        
            )
          }
          {(type === 'remove' || type === 'recolor') && (
            <div className="prompt-field">
              <CustomField
                control={form.control}
                name="prompt"
                formLabel={
                    type === 'remove' ? 'Object to remove' : 'Object to recolor'
                }
                className="w-full"
                render={({ field }) => <Input className="input-field" value={field.value} onChange={(e) => onInputChangeHandler(
                    'promp', e.target.value, type, field.onChange
                )} />}
              />
              {type === 'recolor' && (
                <CustomField
                    control={form.control}
                    name="color"
                    formLabel="Replacement Color"
                    className="w-full"
                    render={({ field }) => (
                        <Input
                        className="input-field"
                        value={field.value}
                        onChange={(e) =>
                            onInputChangeHandler("color", e.target.value, type, field.onChange)
                        }
                        />
                    )}
                />
                
                )}

            </div>
          )
          }
          <div className="media-uploader-field">
            <CustomField
                control={form.control}
                name="publicId"
                className="flex size-full flex-col "
                render={({ field }) => (
                    <MediaUploader
                    onValueChange={field.onChange}
                    setImage={setImage}
                    publicId={field.value}
                    image={image}
                    type={type}

                    />
                )}/>
          </div>
          <div className="flex flex-col gap-4 mt-7">
            <Button
                type="button"
                className="submit-button capitalize"
                disabled={isTransforming || newTransformation === null}
                onClick={onTransformHandler}
                
            > {isTransforming ? "Transforming.." : 'Apply Transformation'} </Button>
          <Button type="submit" className="submit-button capitalize" disabled={isSubmitting}
          > Submit </Button>
            </div>
        </Form>
      )
}

export default TransformationForm